import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export default function TelaRegistrar() {
	const navigation = useNavigation();
	const [email, setEmail] = useState('');
	const [senha, setSenha] = useState('');
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const cadastrar = () => {
		setErrorMessage('');
		setSuccessMessage('');
		if (!email || !senha) {
			setErrorMessage('Preencha e-mail e senha para continuar.');
			return;
		}
		setLoading(true);
		createUserWithEmailAndPassword(auth, email, senha)
			.then((userCredential) => {
				const user = userCredential.user;
				console.log('Cadastro realizado:', user.email);
				setSuccessMessage('Conta criada com sucesso!');
				setTimeout(() => navigation.navigate('Login'), 1200);
			})
			.catch((error) => {
				console.log('Erro ao cadastrar:', error.code, error.message);
				let friendlyMessage = error.message;
				if (error.code === 'auth/email-already-in-use') {
					friendlyMessage = 'Este e-mail já está em uso. Tente fazer login.';
				} else if (error.code === 'auth/weak-password') {
					friendlyMessage = 'A senha deve ter pelo menos 6 caracteres.';
				}
				setErrorMessage('Erro: ' + friendlyMessage);
			})
			.finally(() => setLoading(false));
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Crie sua conta</Text>
			<Text style={styles.subtitle}>Insira seus dados para começar.</Text>

			<View style={styles.formContainer}>
				<Text style={styles.label}>E-mail</Text>
				<TextInput
					placeholder="seu.email@exemplo.com"
					onChangeText={(t) => setEmail(t)}
					keyboardType="email-address"
					autoCapitalize="none"
					style={styles.input}
					value={email}
					placeholderTextColor="#999"
				/>

				<Text style={styles.label}>Senha</Text>
				<TextInput
					placeholder="Mínimo de 6 caracteres"
					onChangeText={(t) => setSenha(t)}
					secureTextEntry={true}
					style={styles.input}
					value={senha}
					placeholderTextColor="#999"
				/>

				<TouchableOpacity
					style={[styles.btnPrimario, loading && styles.btnDesabilitado]}
					onPress={cadastrar}
					disabled={loading}
				>
					<Text style={styles.btnPrimarioText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
				</TouchableOpacity>

				{errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
				{successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}

				<View style={{ height: 24 }} />

				<TouchableOpacity style={styles.btnSecundario} onPress={() => navigation.navigate('Login')} disabled={loading && !successMessage}>
					<Text style={styles.btnSecundarioText}>Já tenho uma conta (Login)</Text>
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
  
  // Título
  title: {
    color: '#FF4500',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  // Subtítulo (Instrução)
  subtitle: {
    color: '#000000ff',
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },

  // Contêiner para os campos de formulário
  formContainer: {
    width: '100%',
    maxWidth: 350, 
  },

  // Rótulos dos campos
  label: {
    color: '#000000ff',
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },

  // Campo de entrada de texto
  input: {
    backgroundColor: '#ffffffff',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    color: '#333',
    marginBottom: 20,
  },

  // Estilos para o botão primário (Cadastrar)
  btnPrimario: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#adadadff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  btnPrimarioText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnDesabilitado: {
    backgroundColor: '#90EE90', 
  },

  // Estilos para o botão secundário (Ir para Login)
  btnSecundario: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSecundarioText: {
    color: '#a2a2a2ff', 
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Mensagens de Feedback
  errorMessage: {
    color: '#FFD700', 
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 15,
  },
  successMessage: {
    color: '#90EE90',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 15,
  }
});
