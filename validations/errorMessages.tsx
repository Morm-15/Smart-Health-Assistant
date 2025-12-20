import i18n from '../i18n';

// دالة للحصول على رسائل الخطأ من Firebase مع الترجمة التلقائية
export const getFirebaseErrorMessage = (code: string): string => {
    // إزالة البادئة إذا كانت موجودة
    const errorCode = code.replace('auth/', '');

    switch (errorCode) {
        // أخطاء البريد الإلكتروني
        case 'invalid-email':
            return i18n.t('errors.invalidEmail');
        case 'user-not-found':
            return i18n.t('errors.userNotFound');
        case 'email-already-in-use':
            return i18n.t('errors.emailAlreadyInUse');
        case 'invalid-credential':
            return i18n.t('errors.invalidCredential');

        // أخطاء كلمة المرور
        case 'wrong-password':
            return i18n.t('errors.wrongPassword');
        case 'weak-password':
            return i18n.t('errors.weakPassword');
        case 'missing-password':
            return i18n.t('errors.missingPassword');
        case 'invalid-password':
            return i18n.t('errors.invalidPassword');

        // أخطاء التحقق والجلسة
        case 'user-disabled':
            return i18n.t('errors.userDisabled');
        case 'too-many-requests':
            return i18n.t('errors.tooManyRequests');
        case 'operation-not-allowed':
            return i18n.t('errors.operationNotAllowed');
        case 'requires-recent-login':
            return i18n.t('errors.requiresRecentLogin');

        // أخطاء الشبكة
        case 'network-request-failed':
            return i18n.t('errors.networkError');
        case 'timeout':
            return i18n.t('errors.timeout');

        // أخطاء عامة
        case 'internal-error':
            return i18n.t('errors.internalError');
        case 'invalid-api-key':
            return i18n.t('errors.invalidApiKey');
        case 'app-deleted':
            return i18n.t('errors.appDeleted');

        // أخطاء التسجيل
        case 'missing-email':
            return i18n.t('errors.missingEmail');
        case 'invalid-verification-code':
            return i18n.t('errors.invalidVerificationCode');
        case 'invalid-verification-id':
            return i18n.t('errors.invalidVerificationId');

        // إعادة تعيين كلمة المرور
        case 'expired-action-code':
            return i18n.t('errors.expiredActionCode');
        case 'invalid-action-code':
            return i18n.t('errors.invalidActionCode');

        // خطأ افتراضي
        default:
            console.warn('Unhandled Firebase error code:', code);
            return i18n.t('errors.defaultError');
    }
};

// دالة للحصول على رسائل خطأ Firestore
export const getFirestoreErrorMessage = (code: string): string => {
    switch (code) {
        case 'permission-denied':
            return i18n.t('errors.permissionDenied');
        case 'not-found':
            return i18n.t('errors.documentNotFound');
        case 'already-exists':
            return i18n.t('errors.documentAlreadyExists');
        case 'resource-exhausted':
            return i18n.t('errors.quotaExceeded');
        case 'cancelled':
            return i18n.t('errors.operationCancelled');
        case 'data-loss':
            return i18n.t('errors.dataLoss');
        case 'unauthenticated':
            return i18n.t('errors.unauthenticated');
        case 'unavailable':
            return i18n.t('errors.serviceUnavailable');
        default:
            return i18n.t('errors.defaultError');
    }
};

// دالة للحصول على رسائل خطأ الشبكة
export const getNetworkErrorMessage = (error: any): string => {
    if (!error) return i18n.t('errors.defaultError');

    if (error.message?.includes('Network')) {
        return i18n.t('errors.networkError');
    }

    if (error.code) {
        // تحقق من نوع الخطأ
        if (error.code.startsWith('auth/')) {
            return getFirebaseErrorMessage(error.code);
        } else if (error.code.startsWith('firestore/')) {
            return getFirestoreErrorMessage(error.code.replace('firestore/', ''));
        }
    }

    return i18n.t('errors.defaultError');
};
