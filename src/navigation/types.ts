/**
 * INSAF - Navigation Types
 *
 * Type definitions for all navigation routes
 */

import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  RegisterRole: { email: string; password: string };
  ForgotPassword: undefined;
  OTPVerification: { email: string; type: 'register' | 'reset' };
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  LawyersTab: undefined;
  CasesTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

// Main Stack (includes tabs and detail screens)
export type MainStackParamList = {
  MainTabs: undefined;
  LawyerDetail: { lawyerId: string };
  CaseDetail: { caseId: string };
  ChatDetail: { chatId: string; userName: string; userAvatar?: string };
  Notifications: undefined;
  AIChatList: { chatType?: 'LAW_COACH' | 'LAW_ASSISTANT'; targetScreen?: string } | undefined;
  LawAssistant: { sessionId?: string } | undefined;
  // Settings screens
  EditProfile: undefined;
  Verification: undefined;
  Documents: undefined;
  Wallet: undefined;
  Transactions: undefined;
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  Help: undefined;
  Support: undefined;
  Terms: undefined;
  Privacy: undefined;
  LawCoach: { sessionId?: string } | undefined;
};

// Lawyer Tab Navigator
export type LawyerTabParamList = {
  DashboardTab: undefined;
  CasesTab: undefined;
  BidsTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

// Lawyer Stack (includes tabs and detail screens)
export type LawyerStackParamList = {
  LawyerTabs: undefined;
  CaseDetail: { caseId: string };
  SubmitBid: { caseId: string };
  ChatDetail: { conversationId: string };
  LawyerEarnings: undefined;
  LawyerProfileEdit: undefined;
  LawyerVerification: undefined;
  Notifications: undefined;
  AIChatList: { chatType?: 'LAW_COACH' | 'LAW_ASSISTANT'; targetScreen?: string } | undefined;
  LawAssistant: { sessionId?: string } | undefined;
  // Settings screens
  Wallet: undefined;
  Transactions: undefined;
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  Help: undefined;
  Support: undefined;
  Terms: undefined;
  Privacy: undefined;
};

// Root Stack (combines all)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Lawyer: NavigatorScreenParams<LawyerStackParamList>;
  Onboarding: undefined;
  // Modal screens
  DocumentViewer: { documentUrl: string; title?: string };
  BookConsultation: { lawyerId: string };
};

// Global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
