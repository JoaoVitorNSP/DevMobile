import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Button,
  Image,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { database } from "./firebase";
import { ref, onValue, push, update } from "firebase/database"; 
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function TelaHome() {
  // --- ESTADOS GERAIS ---
  const [cepConsulta, setCepConsulta] = useState("");
  const [enderecoConsulta, setEnderecoConsulta] = useState({});

  const [location, setLocation] = useState(null);
  const [errors, setErrors] = useState(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [foto, setFoto] = useState(null);
  const cameraRef = useRef(null);
  const [storagePermission, reqStoragePermission] = MediaLibrary.usePermissions();
  const [imagePickerPermission, requestImagePickerPermission] =
    ImagePicker.useMediaLibraryPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // --- ESTADOS PARA O REGISTRO DE PETFINDER ---
  const [nomePet, setNomePet] = useState("");
  const [tipoPet, setTipoPet] = useState("");
  const [descricaoPet, setDescricaoPet] = useState("");
  const [contatoDono, setContatoDono] = useState(""); 
  const [cepRegistro, setCepRegistro] = useState(""); 
  const [enderecoRegistro, setEnderecoRegistro] = useState({}); 
  const [petsPerdidos, setPetsPerdidos] = useState([]);

  // --- ESTADO PARA OS DETALHES (Simulando navegação) ---
  const [petSelecionado, setPetSelecionado] = useState(null); 

  // --- USE EFFECTS ---

  useEffect(() => {
    // Permissões de Mídia
    if (!storagePermission?.granted) {
      reqStoragePermission();
    }
    if (!imagePickerPermission?.granted) {
      requestImagePickerPermission();
    }
  }, []);

  useEffect(() => {
    // Permissão e Captura de Localização (GPS)
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location.coords);
      } else {
        setErrors("Permissão negada, pois o usuário não aceitou");
        Alert.alert(
          "Permissão negada",
          "Favor aceitar a localização para o PetFinder."
        );
      }
    })();
  }, []);

  
  useEffect(() => {
    const petsRef = ref(database, "petsPerdidos");

    const unsubscribe = onValue(petsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaPets = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setPetsPerdidos(listaPets.reverse());
      } else {
        setPetsPerdidos([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÕES DE INTEGRAÇÃO ---

  // Função de Localizar CEP para CONSULTA GERAL
  function consultarCEPGlobal() {
    if (cepConsulta.length !== 8 || isNaN(cepConsulta)) {
      Alert.alert("CEP Inválido", "O CEP deve ter 8 dígitos numéricos.");
      setEnderecoConsulta({});
      return;
    }
    fetch("https://viacep.com.br/ws/" + cepConsulta + "/json/")
      .then((response) => response.json())
      .then((result) => {
        if (result.erro) {
          Alert.alert("Erro", "CEP não encontrado.");
          setEnderecoConsulta({});
        } else {
          setEnderecoConsulta(result);
        }
      })
      .catch((error) => {
        console.log("Falha ao conectar, você está sem internet", error);
        Alert.alert(
          "Erro de Conexão",
          "Falha ao conectar. Verifique sua internet."
        );
      });
  }

  function localizarCEPRegistro() {
    if (cepRegistro.length !== 8 || isNaN(cepRegistro)) {
      Alert.alert("CEP Inválido", "O CEP deve ter 8 dígitos numéricos.");
      setEnderecoRegistro({});
      return;
    }
    fetch("https://viacep.com.br/ws/" + cepRegistro + "/json/")
      .then((response) => response.json())
      .then((result) => {
        if (result.erro) {
          Alert.alert("Erro", "CEP de registro não encontrado.");
          setEnderecoRegistro({});
        } else {
          setEnderecoRegistro(result);
          Alert.alert("Endereço Encontrado", `${result.logradouro}, ${result.bairro}, ${result.localidade} - ${result.uf}`);
        }
      })
      .catch((error) => {
        console.log("Falha ao conectar, você está sem internet", error);
        Alert.alert(
          "Erro de Conexão",
          "Falha ao conectar. Verifique sua internet."
        );
        setEnderecoRegistro({});
      });
  }
  
  // Funções de Câmera e Galeria 
  const tirarFoto = async () => {
    if (cameraRef.current) {
      const fotoCapturada = await cameraRef.current.takePictureAsync();
      setFoto(fotoCapturada.uri);
      setIsCameraOpen(false);
    }
  };

  const selecionarDaGaleria = async () => {
    if (!imagePickerPermission?.granted) {
      const { status } = await requestImagePickerPermission();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "É preciso de permissão para acessar sua galeria de fotos."
        );
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  // --- FUNÇÃO PETFINDER: REGISTRAR PET PERDIDO  ---
  const registrarPetPerdido = async () => {
    // 1. Validação dos Campos Obrigatórios
    if (!location) {
      Alert.alert("Erro GPS", "Aguarde, sua localização ainda está sendo determinada.");
      return;
    }
    if (!foto) {
      Alert.alert("Aviso", "Por favor, tire ou selecione uma foto do pet.");
      return;
    }
    if (nomePet.trim() === "" || tipoPet.trim() === "" || contatoDono.trim() === "") {
      Alert.alert("Aviso", "Preencha o Nome/Característica, Tipo e Contato do doador.");
      return;
    }
    // 2. Validação do Endereço de Perda
    if (Object.keys(enderecoRegistro).length === 0 || enderecoRegistro.erro) {
        Alert.alert("Erro de Endereço", "Por favor, busque e valide o CEP de onde o pet foi perdido.");
        return;
    }

    try {
      const novoPet = {
        nome: nomePet.trim(),
        tipo: tipoPet.trim(),
        descricao: descricaoPet.trim(),
        fotoUri: foto, 
        latitude: location.latitude,
        longitude: location.longitude,
        dataRegistro: new Date().toISOString(),
        status: "perdido", 
        
        contato: contatoDono.trim(),
        cep: cepRegistro,
        logradouro: enderecoRegistro.logradouro || 'N/A',
        bairro: enderecoRegistro.bairro || 'N/A',
        cidade: enderecoRegistro.localidade || 'N/A',
        uf: enderecoRegistro.uf || 'N/A',
      };

      const petsRef = ref(database, "petsPerdidos");
      await push(petsRef, novoPet);

      Alert.alert(
        "Sucesso",
        `Pet: ${nomePet} registrado com sucesso na localização atual!`
      );

      // Limpa os campos após o registro
      setNomePet("");
      setTipoPet("");
      setDescricaoPet("");
      setContatoDono("");
      setCepRegistro("");
      setEnderecoRegistro({});
      setFoto(null);
    } catch (error) {
      console.error("Erro ao registrar pet:", error);
      Alert.alert("Erro", "Falha ao registrar pet. Tente novamente.");
    }
  };

  // --- FUNÇÕES DE DETALHES E STATUS ---

  const abrirDetalhes = (pet) => {
    setPetSelecionado(pet);
  };

  const fecharDetalhes = () => {
    setPetSelecionado(null);
  };

  const marcarComoEncontrado = async () => {
    if (!petSelecionado) return;
    
    try {
        const petRef = ref(database, `petsPerdidos/${petSelecionado.id}`);

        await update(petRef, { status: 'encontrado' }); 
        
        Alert.alert("Sucesso", `${petSelecionado.nome} foi marcado como encontrado!`);
        fecharDetalhes();
    } catch (error) {
        console.error("Erro ao marcar como encontrado:", error);
        Alert.alert("Erro", "Falha ao atualizar o status do pet.");
    }
  };


  // --- LÓGICA DE RENDERIZAÇÃO CONDICIONAL DA CÂMERA/DETALHES ---

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Precisamos da sua permissão para usar a câmera.
        </Text>
        <Button
          onPress={requestPermission}
          title="Conceder Permissão"
          color={colors.primary}
        />
      </View>
    );
  }
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView facing="back" ref={cameraRef} style={styles.fullCamera} />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={tirarFoto}>
            <Ionicons name="camera" size={30} color={colors.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.closeCameraButton}
          onPress={() => setIsCameraOpen(false)}
        >
          <Ionicons name="close-circle" size={40} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }
  
  // RENDERIZAÇÃO CONDICIONAL: PAINEL DE DETALHES
  if (petSelecionado) {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
            <Text style={[styles.title, {marginBottom: 10}]}>Detalhes do Pet</Text>
            <View style={styles.section}>
                <View style={{alignItems: 'center', marginBottom: 15}}>
                    {petSelecionado.fotoUri && (
                        <Image source={{ uri: petSelecionado.fotoUri }} style={styles.detailImage} />
                    )}
                </View>

                <Text style={styles.detailTitle}>Pet: {petSelecionado.nome} ({petSelecionado.tipo})</Text>
                
                <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Descrição:</Text>
                    <Text style={styles.detailText}>{petSelecionado.descricao || 'Nenhuma descrição fornecida.'}</Text>
                </View>

                <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Contato do Dono:</Text>
                    <Text style={styles.detailText}>{petSelecionado.contato}</Text>
                </View>
                
                <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Perdido em:</Text>
                    <Text style={styles.detailText}>{petSelecionado.logradouro}, {petSelecionado.bairro}</Text>
                    <Text style={styles.detailText}>{petSelecionado.cidade} - {petSelecionado.uf} (CEP: {petSelecionado.cep})</Text>
                </View>

                <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailText, {fontWeight: 'bold', color: petSelecionado.status === 'perdido' ? colors.secondary : colors.success}]}>
                        {petSelecionado.status.toUpperCase()}
                    </Text>
                </View>
                
                <View style={{marginTop: 20}}>
                    <Button
                        title="Marcar como Encontrado"
                        onPress={marcarComoEncontrado}
                        color={colors.success}
                        disabled={petSelecionado.status !== 'perdido'}
                    />
                    <View style={{marginTop: 10}}>
                        <Button
                            title="Voltar para a Lista"
                            onPress={fecharDetalhes}
                            color={colors.primary}
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
  }

  // --- LAYOUT PRINCIPAL DA TELA HOME ---
  
  const petsPerdidosAtivos = petsPerdidos.filter(pet => pet.status === 'perdido');

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      style={styles.container}
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>🐾 PetFinder</Text>
      <Text style={styles.subtitle}>
        Registre e localize pets perdidos na comunidade.
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
          ⚠️ Registrar Pet Perdido
        </Text>
        <Text style={styles.label}>Nome/Característica do Pet:</Text>
        <TextInput
          placeholder="Ex: Rex, Cão Dourado, Gato Preto"
          onChangeText={setNomePet}
          style={styles.input}
          value={nomePet}
        />

        <Text style={styles.label}>Tipo de Pet:</Text>
        <TextInput
          placeholder="Ex: Cachorro, Gato, Calopsita"
          onChangeText={setTipoPet}
          style={styles.input}
          value={tipoPet}
        />
        
        <Text style={styles.label}>Contato do Dono (Telefone/Email):</Text>
        <TextInput
          placeholder="Para ser contatado se encontrarem o pet"
          onChangeText={setContatoDono}
          style={styles.input}
          value={contatoDono}
        />

        <Text style={styles.label}>
          Descrição (Cor, Tamanho, Coleira, etc.):
        </Text>
        <TextInput
          placeholder="Detalhes importantes do pet"
          onChangeText={setDescricaoPet}
          style={[styles.input, { height: 80 }]}
          multiline={true}
          value={descricaoPet}
        />
        
        <Text style={styles.label}>📍 CEP de onde o pet foi perdido:</Text>
        <View style={styles.inputWithButton}>
            <TextInput
            placeholder="Apenas números (8 dígitos)"
            onChangeText={setCepRegistro}
            keyboardType="numeric"
            style={[styles.input, {marginBottom: 0, flex: 1, marginRight: 10}]}
            maxLength={8}
            value={cepRegistro}
            />
            <Button
            title="Buscar Endereço"
            onPress={localizarCEPRegistro}
            color={colors.primary}
            />
        </View>

        {Object.keys(enderecoRegistro).length > 0 && !enderecoRegistro.erro && (
            <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
                Endereço de perda: {enderecoRegistro.logradouro}, {enderecoRegistro.bairro} ({enderecoRegistro.localidade} - {enderecoRegistro.uf})
            </Text>
            </View>
        )}

        <Text style={[styles.label, { marginTop: 15 }]}>Foto do Pet (Obrigatório):</Text>
        {foto ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: foto }} style={styles.imagem} />
            <Button
              title="Tirar/Selecionar Outra Foto"
              onPress={() => setFoto(null)}
              color={colors.secondary}
            />
          </View>
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.cameraButton, { flex: 1 }]}
              onPress={() => setIsCameraOpen(true)}
            >
              <Ionicons name="camera" size={30} color={colors.white} />
              <Text style={styles.cameraButtonText}>Tirar Foto</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={[styles.galleryButton, { flex: 1 }]}
              onPress={selecionarDaGaleria}
            >
              <Ionicons name="images" size={30} color={colors.white} />
              <Text style={styles.cameraButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.label, { marginTop: 15 }]}>
          📍 Localização GPS do Registro (Opcional):
        </Text>
        {location ? (
          <Text style={styles.resultText}>
            ✅ Localização OK! Lat: {location.latitude.toFixed(4)}, Long:{" "}
            {location.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={[styles.resultText, { color: colors.secondary }]}>
            Aguardando GPS...
          </Text>
        )}

        <View style={{ marginTop: 20 }}>
          <Button
            title="Registrar Pet Perdido"
            onPress={registrarPetPerdido}
            color={colors.secondary}
          />
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          🗺️ Pets Perdidos Próximos
        </Text>

        <Text style={styles.label}>Clique para ver detalhes e contato:</Text>
        <FlatList
          data={petsPerdidosAtivos} 
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.petListItem} onPress={() => abrirDetalhes(item)}>
              {item.fotoUri && (
                <Image source={{ uri: item.fotoUri }} style={styles.smallImage} />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.petName}>
                  **{item.nome}** ({item.tipo})
                </Text>
                <Text style={styles.petDetails}>
                  Perdido em: {item.cidade} - {item.uf}
                </Text>
                <Text style={[styles.petDetails, {color: colors.secondary, fontWeight: 'bold'}]}>
                    Ver Detalhes »
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              Nenhum pet perdido ativo registrado.
            </Text>
          }
        />
        
        <Text style={[styles.label, { marginTop: 15 }]}>
          Mapa da Sua Área:
        </Text>
        {!location ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        ) : (
          <MapView
            style={styles.mapa}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05, 
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Você Está Aqui"
              pinColor={colors.primary}
            />

            {petsPerdidosAtivos.map((pet) => (
              <Marker
                key={pet.id}
                coordinate={{
                  latitude: pet.latitude,
                  longitude: pet.longitude,
                }}
                title={pet.nome}
                description={`Perdido em ${pet.cidade} (${pet.uf})`}
                pinColor={colors.secondary}
                onCalloutPress={() => abrirDetalhes(pet)}
              />
            ))}
          </MapView>
        )}
      </View>

      <View style={styles.separator} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ Consulta Rápida de Endereço</Text>
        <TextInput
          placeholder="Digite o CEP (apenas números)"
          onChangeText={(text) => setCepConsulta(text)}
          keyboardType="numeric"
          style={styles.input}
          maxLength={8}
          value={cepConsulta}
        />
        <Button
          onPress={() => consultarCEPGlobal()}
          title="Consultar CEP"
          color={colors.primary}
        ></Button>
        {enderecoConsulta.localidade && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>
              <Text style={styles.label}>Logradouro:</Text> {enderecoConsulta.logradouro}
            </Text>
            <Text style={styles.resultText}>
              <Text style={styles.label}>Bairro:</Text> {enderecoConsulta.bairro}
            </Text>
            <Text style={styles.resultText}>
              <Text style={styles.label}>Cidade/UF:</Text> {enderecoConsulta.localidade} - {enderecoConsulta.uf}
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// Definição de Cores
const colors = {
  primary: "#007BFF", 
  secondary: "#FF4500", 
  success: "#28A745", 
  background: "#F8F8F8", 
  cardBackground: "#FFFFFF", 
  text: "#333333", 
  lightText: "#666666", 
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.secondary, 
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lightText,
    marginBottom: 30,
  },
  section: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 5,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    height: 40,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: colors.white,
    color: colors.text,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultContainer: {
    marginTop: 5,
    padding: 10,
    backgroundColor: "#FFF2E6", 
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    marginBottom: 15,
  },
  resultText: {
    fontSize: 14,
    color: colors.text,
  },
  list: {
    marginTop: 10,
    maxHeight: 250, 
  },
  emptyListText: {
    textAlign: "center",
    color: colors.lightText,
    marginTop: 10,
  }, 
  // --- Estilos de Câmera e Galeria ---
  cameraButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", 
  },
  galleryButton: {
    backgroundColor: colors.success,
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  fullCamera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 20,
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  closeCameraButton: {
    position: "absolute",
    top: 50, 
    right: 20,
    padding: 5,
  },
  photoPreviewContainer: {
    alignItems: "center",
  },
  imagem: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#CCC",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  }, 
  // --- Estilos do Mapa ---
  mapa: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  permissionText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
    color: colors.text,
  },
  // --- Estilos PetFinder ---
  petListItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF7F5", 
    borderRadius: 5,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  petName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.secondary,
  },
  petDetails: {
    fontSize: 12,
    color: colors.lightText,
    marginTop: 2,
  },
  // --- Estilos Detalhes ---
  detailImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 15,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 15,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  detailCard: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  detailText: {
    fontSize: 16,
    color: colors.text,
  }
});