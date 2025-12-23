// navigation/types.ts
import { Medication } from '../services/medicationService';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    Home: undefined;
    ChatAI: undefined;
    AddMedicationScreen: { medication?: Medication; isEdit?: boolean } | undefined;
    ManageMedicationsScreen: undefined;
    SkinDiseaseCamera: undefined;
    Settings: undefined;
    EditProfile: undefined;
    ChangePassword: undefined;
    TestNotifications: undefined;
};
