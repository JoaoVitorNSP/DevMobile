import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Image, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import TelaHome from './TelaHome';

export default function TelaLogin() {
  const navigation = useNavigation();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validarLogin = () => {
    setErrorMessage('');
    setLoading(true);
    signInWithEmailAndPassword(auth, login, senha)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('Logado:', user.email);
        navigation.navigate("Home");
      })
      .catch(error => {
        console.log('Erro no login:', error.code, error.message);
        setErrorMessage((error.code ? error.code + ': ' : '') + error.message);
      })
      .finally(() => setLoading(false));
  }

  return (

    <ScrollView contentContainerStyle={styles.container}>

      <Image 
        style={styles.logo} 
        source={{uri:'https://png.pngtree.com/element_pic/16/11/02/bd886d7ccc6f8dd8db17e841233c9656.jpg'}}
      />
      
      <Text style={styles.titulo}>PET FINDER</Text>
      <Text style={styles.titulo}>Bem-vindo!</Text>
      

      <View style={styles.formContainer}>
        
        <Text style={styles.label}>Login (E-mail)</Text>
        <TextInput 
          style={styles.input}
          onChangeText={text => setLogin(text)} 
          value={login}
          placeholder='seu.email@exemplo.com'
          keyboardType='email-address'
          autoCapitalize='none'
          placeholderTextColor="#999"
        />
        
        <View style={{ height: 16 }} />

        <Text style={styles.label}>Senha</Text>
        <TextInput 
          style={styles.input}
          onChangeText={text => setSenha(text)} 
          value={senha}
          secureTextEntry={true} 
          placeholder='Insira sua senha'
          placeholderTextColor="#999"
        />

        <View style={{ height: 24 }} />

        <TouchableOpacity
          style={[styles.btnPrimario, loading && styles.btnDesabilitado]}
          onPress={validarLogin}
          disabled={loading}
        >
          <Text style={styles.btnPrimarioText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        <View style={{ height: 16 }} />

        <TouchableOpacity
          style={styles.btnSecundario}
          onPress={() => navigation.navigate('Registrar')}
        >
          <Text style={styles.btnSecundarioText}>
            Criar Nova Conta (Registrar)
          </Text>
        </TouchableOpacity>

      </View>
      
      <StatusBar style="light" /> 
    </ScrollView>
  );
}

// ------------------------------------------------------------------
// ## Estilos
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  // Contêiner principal
  container: {
    flexGrow: 1, 
    backgroundColor: '#ffffffff', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  
  // Logo
  logo: {
    width: 250,
    height: 150,
    resizeMode: 'contain', 
    marginBottom: 30,
  },

  // Título (Bem-vindo)
  titulo: {
    color: '#FF4500',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },

  // Contêiner para os campos de formulário
  formContainer: {
    width: '100%',
    maxWidth: 350, 
  },

  // Rótulos dos campos
  label: {
    color: '#030303ff',
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },

  // Campo de entrada de texto
  input: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#030303ff',
    color: '#6f6f6fff',
  },

  // Estilos para o botão primário (Login)
  btnPrimario: {
    backgroundColor: '#007BFF', 
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    // Sombra para iOS
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Elevação para Android
    elevation: 8,
  },
  btnPrimarioText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnDesabilitado: {
    backgroundColor: '#c9301fff', 
  },

  // Estilos para o botão secundário (Registrar)
  btnSecundario: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSecundarioText: {
    color: '#636262ff', 
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Mensagem de Erro
  errorMessage: {
    color: '#ff9100ff', 
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  }
});