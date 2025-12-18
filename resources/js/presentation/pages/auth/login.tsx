import InputError from '@/presentation/components/input-error';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    const { props } = usePage();

    // ✅ Log cuando el usuario se autentica (el token está disponible en props.auth.sanctumToken)
    useEffect(() => {
        if (props?.auth?.user && (props?.auth as any)?.sanctumToken) {
            console.log('✅ Usuario autenticado exitosamente');
            console.log(`✅ Token SANCTUM disponible en props.auth.sanctumToken`);
            console.log(`✅ Usuario: ${props?.auth?.user?.name}`);
        }
    }, [props?.auth?.sanctumToken, props?.auth?.user]);

    return (
        <AuthLayout title="Inicia sesión en tu cuenta" description="Ingresa tu correo o usuario y contraseña para continuar">
            <Head title="Iniciar sesión" />

            <Form
                method="POST"
                action="/login"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
                onSubmit={(e) => {
                    // Guardar datos del formulario para posterior generación de token
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    formDataRef.current = {
                        email: formData.get('email') as string,
                        password: formData.get('password') as string,
                    };
                }}
            >
                {({ processing, errors }) => (
                    <>
                        {/* Encabezado con logo para identidad de marca
                        <div className="flex flex-col items-center gap-3">
                            <img src="/logo.svg" alt="Distribuidora Paucara" className="h-12 w-auto" />
                            <p className="text-xs text-muted-foreground">Sistema de gestión de ventas</p>
                        </div>*/}

                        <div className="grid gap-6 rounded-lg border bg-background/60 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo o usuario</Label>
                                <Input
                                    id="email"
                                    type="text"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    placeholder="correo@ejemplo.com o usuario"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                    {/*{canResetPassword && (
                                        <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                            ¿Olvidaste tu contraseña?
                                        </TextLink>
                                    )}*/}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Contraseña"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Recordarme</Label>
                            </div>

                            <Button type="submit" className="mt-2 w-full bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-600/30 dark:bg-red-500 dark:hover:bg-red-600" tabIndex={4} disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Iniciar sesión
                            </Button>
                        </div>

                        {/*<div className="text-center text-sm text-muted-foreground">
                            ¿No tienes una cuenta?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Regístrate
                            </TextLink>
                        </div>*/}
                    </>
                )}
            </Form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
