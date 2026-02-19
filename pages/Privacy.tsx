
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const Privacy: React.FC = () => {
    useSEO('Política de Privacidade', 'Saiba como coletamos, usamos e protegemos seus dados.');
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg-dark text-slate-300 selection:bg-primary selection:text-bg-dark p-8 md:p-16">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white mb-8 transition-colors uppercase tracking-widest"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Voltar para Home
                </button>

                <h1 className="text-4xl font-black text-white mb-2">Política de Privacidade</h1>
                <p className="text-sm text-slate-500 mb-12">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Coleta de Dados</h2>
                        <p>Coletamos informações que você nos fornece diretamente, como nome, email e dados de pagamento (processados de forma segura via Asaas). Também podemos coletar dados de uso da plataforma para melhorar nossos serviços.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Uso das Informações</h2>
                        <p>Utilizamos seus dados para:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                            <li>Fornecer, manter e melhorar nossos serviços;</li>
                            <li>Processar transações e enviar notificações relacionadas;</li>
                            <li>Responder a seus comentários e solicitações de suporte;</li>
                            <li>Enviar comunicações de marketing (você pode optar por não receber).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Compartilhamento de Dados</h2>
                        <p>Não vendemos seus dados pessoais. Podemos compartilhar informações com prestadores de serviços terceirizados (como processadores de pagamento) que precisam acessar os dados para realizar trabalhos em nosso nome, sob estrita confidencialidade.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Segurança</h2>
                        <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição. Utilizamos criptografia e protocolos seguros (HTTPS).</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Seus Direitos (LGPD)</h2>
                        <p>Você tem o direito de solicitar acesso, correção ou exclusão de seus dados pessoais, bem como a portabilidade dos dados. Para exercer esses direitos, entre em contato conosco através do suporte.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. Cookies</h2>
                        <p>Utilizamos cookies para melhorar sua experiência na plataforma, lembrar suas preferências e analisar o tráfego. Você pode controlar o uso de cookies nas configurações do seu navegador.</p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-600">© 2024 FL360 Miles. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
