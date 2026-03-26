'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Determine the correct socket URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://restrosathi.onrender.com';
    
    // Create new socket connection
    const newSocket = io(baseUrl, {
      transports: ['websocket', 'polling'], // Faster connection
      reconnectionAttempts: 5
    });
    
    newSocket.on('connect', () => {
      console.log('Socket Context: Connection established with ID:', newSocket.id);
      
      // If user session is already active, join the room immediately
      if (user?.restaurantId) {
        console.log('Socket Context: Rejoining restaurant room on connect:', user.restaurantId);
        newSocket.emit('joinRestaurant', user.restaurantId);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket Context: Disconnected. Reason:', reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off(); // Cleanup all listeners
      newSocket.disconnect();
    };
  }, [user?.restaurantId]); // Include restaurantId to re-init on login/logout

  // Watch for user changes to join/switch rooms
  useEffect(() => {
    if (socket && user?.restaurantId) {
      console.log('Socket Context: User changed. Subscribing to room:', user.restaurantId);
      socket.emit('joinRestaurant', user.restaurantId);
    }
  }, [socket, user?.restaurantId]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
