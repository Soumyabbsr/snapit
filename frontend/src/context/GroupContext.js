import React, { createContext, useContext, useReducer, useCallback } from 'react';
import * as api from '../api/groups';

const GroupContext = createContext();

const initialState = {
  groups: [],
  selectedGroup: null,
  loading: false,
  error: null,
};

const groupReducer = (state, action) => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, groups: action.payload, loading: false, error: null };
    case 'SELECT_GROUP':
      return { ...state, selectedGroup: action.payload };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const GroupProvider = ({ children }) => {
  const [state, dispatch] = useReducer(groupReducer, initialState);

  const fetchUserGroups = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const { groups } = await api.getUserGroups();
      dispatch({ type: 'FETCH_SUCCESS', payload: groups });
    } catch (err) {
      dispatch({ type: 'ERROR', payload: err.message });
    }
  }, []);

  const createGroup = async (name, icon) => {
    try {
      const { group } = await api.createGroup(name, icon);
      await fetchUserGroups(); // reload groups
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const joinGroup = async (code) => {
    try {
      const { group } = await api.joinGroupByCode(code);
      await fetchUserGroups();
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await api.leaveGroup(groupId);
      await fetchUserGroups();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const selectGroup = (groupId) => {
    dispatch({ type: 'SELECT_GROUP', payload: groupId });
  };

  return (
    <GroupContext.Provider
      value={{
        ...state,
        fetchUserGroups,
        createGroup,
        joinGroup,
        leaveGroup,
        selectGroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);
