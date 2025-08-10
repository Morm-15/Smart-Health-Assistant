// validations/authValidations.ts

export const validateLoginFields = (email: string, password: string): string | null => {
    if (!email || !password) {
        return 'يرجى إدخال البريد وكلمة المرور.';
    }
    return null;
};

export const validateRegisterFields = (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword: string
): string | null => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return 'يرجى تعبئة جميع الحقول.';
    }
    if (password !== confirmPassword) {
        return 'كلمة المرور وتأكيدها غير متطابقتين.';
    }
    return null;
};
