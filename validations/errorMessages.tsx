// validations/errorMessages.ts

export const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
        case 'auth/invalid-email':
            return 'البريد الإلكتروني غير صحيح.';
        case 'auth/user-not-found':
            return 'المستخدم غير موجود.';
        case 'auth/wrong-password':
            return 'كلمة المرور غير صحيحة.';
        case 'auth/email-already-in-use':
            return 'البريد الإلكتروني مستخدم بالفعل.';
        default:
            return 'حدث خطأ، حاول مرة أخرى.';
    }
};
