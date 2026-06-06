import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { register, login } from '@/api/auth';
import type { RegisterRequest, LoginRequest } from '@shared/types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    setIsVisible(true);
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = '请输入用户名';
    } else if (formData.username.length < 2) {
      errors.username = '用户名至少2个字符';
    }

    if (!formData.email.trim()) {
      errors.email = '请输入邮箱';
    } else if (!validateEmail(formData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      errors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      errors.password = '密码至少6位';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次密码输入不一致';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return { level: 0, text: '', color: '' };
    if (pwd.length < 6) return { level: 1, text: '弱', color: 'bg-red-400' };
    if (pwd.length < 10) return { level: 2, text: '中', color: 'bg-yellow-400' };
    return { level: 3, text: '强', color: 'bg-green-400' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const registerResponse = await register(formData);
      if (!registerResponse.success) {
        setError(registerResponse.message || '注册失败，请稍后重试');
        return;
      }

      const loginData: LoginRequest = {
        username: formData.username,
        password: formData.password,
      };
      const loginResponse = await login(loginData);
      if (loginResponse.success && loginResponse.data) {
        loginStore(loginResponse.data);
        navigate('/');
      } else {
        setError('注册成功，但自动登录失败，请手动登录');
        navigate('/login');
      }
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-300/20 rounded-full blur-2xl" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-pink-300/20 rounded-full blur-2xl" />

      <div
        className={`w-full max-w-md relative z-10 transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30 mb-6">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">创建账号</h1>
            <p className="text-gray-500 text-base">开启你的习惯养成之旅</p>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="用户名"
                name="username"
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
                error={validationErrors.username}
                autoComplete="username"
              />

              <Input
                label="邮箱"
                name="email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleChange}
                error={validationErrors.email}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  label="密码"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码（至少6位）"
                  value={formData.password}
                  onChange={handleChange}
                  error={validationErrors.password}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                {formData.password && passwordStrength.level > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      <div className={`h-1.5 flex-1 rounded-full ${passwordStrength.level >= 1 ? passwordStrength.color : 'bg-gray-200'}`} />
                      <div className={`h-1.5 flex-1 rounded-full ${passwordStrength.level >= 2 ? passwordStrength.color : 'bg-gray-200'}`} />
                      <div className={`h-1.5 flex-1 rounded-full ${passwordStrength.level >= 3 ? passwordStrength.color : 'bg-gray-200'}`} />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.level === 1 ? 'text-red-500' :
                      passwordStrength.level === 2 ? 'text-yellow-600' : 'text-green-500'
                    }`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  label="确认密码"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={validationErrors.confirmPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 bottom-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">两次密码一致</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    注册中...
                  </>
                ) : (
                  '注册'
                )}
              </Button>
            </form>

            <p className="text-center text-gray-600 mt-8 text-base">
              已有账号？
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 font-semibold ml-1 transition-colors"
              >
                立即登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
