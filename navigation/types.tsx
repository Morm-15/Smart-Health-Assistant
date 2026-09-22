// navigation/types.ts
import { Medication } from '../services/medicationService';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    Home: undefined;
    ChatAI: { initialPrompt?: string } | undefined;
    AddMedicationScreen: { medication?: Medication; isEdit?: boolean } | undefined;
    ManageMedicationsScreen: undefined;
    SkinDiseaseCamera: undefined;
    Settings: undefined;
    EditProfile: undefined;
    ChangePassword: undefined;
    MedicalDevicesGuide: undefined;
    LabReportAnalyzer: undefined;
    DrugInteraction: undefined;
    FirstAidGuide: undefined;
};
