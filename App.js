import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Image, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TelaLogin from './TelaLogin';
import TelaHome  from './TelaHome';
import TelaRegistrar from './TelaRegistrar';

const Stack = createNativeStackNavigator();

export default function App() {
  return(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
  <Stack.Screen name="Login" component={TelaLogin} />
  <Stack.Screen name="Registrar" component={TelaRegistrar} />
  <Stack.Screen name="Home" component={TelaHome}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
