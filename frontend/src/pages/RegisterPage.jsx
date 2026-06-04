import AuthLayout from "../features/auth/components/AuthLayout";
import RegisterForm from "../features/auth/components/RegisterForm";

const RegisterPage = () => {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;