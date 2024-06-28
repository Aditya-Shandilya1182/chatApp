import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);
  const [token, setToken] = useState(null); // Add state to store token

  useEffect(() => {
    // Fetch user profile including token
    axios.get('/auth/profile')
      .then(response => {
        const { userId, username, token } = response.data;
        setId(userId);
        setUsername(username);
        setToken(token);

        // Store token in localStorage for persistence (optional)
        localStorage.setItem('token', token);

        // Set token in axios headers for subsequent requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
      });
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </UserContext.Provider>
  );
}
