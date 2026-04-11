import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// ─── Home Stack Screens ───────────────────────────────────────
import HomeScreen from '../screens/home/HomeScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import JoinGroupScreen from '../screens/groups/JoinGroupScreen';
import GroupDetailsScreen from '../screens/groups/GroupDetailsScreen';
import InviteScreen from '../screens/groups/InviteScreen';
import SendInviteScreen from '../screens/groups/SendInviteScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import PhotoPreviewScreen from '../screens/camera/PhotoPreviewScreen';
import UploadScreen from '../screens/photos/UploadScreen';
import PhotoDetailScreen from '../screens/photos/PhotoDetailScreen';
import UploadQueueScreen from '../screens/upload/UploadQueueScreen';

// ─── Profile Stack Screens ────────────────────────────────────
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import WidgetSetupScreen from '../screens/profile/WidgetSetupScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const GroupStack = createNativeStackNavigator();

// ─── Group Internal Stack ─────────────────────────────────────
const GroupStackNavigator = () => (
  <GroupStack.Navigator screenOptions={{ headerShown: false }}>
    <GroupStack.Screen name="GroupFeed" component={GroupDetailsScreen} />
    <GroupStack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
    <GroupStack.Screen name="SendInvite" component={SendInviteScreen} />
  </GroupStack.Navigator>
);

// ─── Home Stack (includes Camera, Upload, Invites, etc.) ──────
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    <HomeStack.Screen name="CreateGroup" component={CreateGroupScreen} />
    <HomeStack.Screen name="JoinGroup" component={JoinGroupScreen} />
    <HomeStack.Screen name="GroupStack" component={GroupStackNavigator} />
    {/* Camera flow */}
    <HomeStack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ animation: 'fade' }}
    />
    <HomeStack.Screen
      name="PhotoPreview"
      component={PhotoPreviewScreen}
      options={{ animation: 'fade' }}
    />
    {/* Upload flow */}
    <HomeStack.Screen name="Upload" component={UploadScreen} />
    <HomeStack.Screen name="UploadQueue" component={UploadQueueScreen} />
    {/* Invites */}
    <HomeStack.Screen
      name="Invites"
      component={InviteScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </HomeStack.Navigator>
);

// ─── Profile Stack ─────────────────────────────────────────────
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="WidgetSetup" component={WidgetSetupScreen} />
  </ProfileStack.Navigator>
);

// ─── Bottom Tabs ───────────────────────────────────────────────
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#1f1f1f',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size + 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
