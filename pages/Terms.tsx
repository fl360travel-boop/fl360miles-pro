
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

const Terms: React.FC = () => {
    useSEO('Termos de Uso', 'Leia nossos termos de uso e condições de serviço.');
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

                <h1 className="text-4xl font-black text-white mb-2">Termos de Uso</h1>
                <p className="text-sm text-slate-500 mb-12">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                        <p>Ao acessar e usar a plataforma FL360 Miles, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Uso da Plataforma</h2>
                        <p>A FL360 Miles concede a você uma licença limitada, não exclusiva e intransferível para usar nossos serviços de gestão de milhas. Você concorda em não usar a plataforma para fins ilegais ou não autorizados.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Planos e Pagamentos</h2>
                        <p>Os serviços são oferecidos mediante assinatura (anual). Os pagamentos são processados via Asaas. O cancelamento pode ser solicitado a qualquer momento, sujeito às regras de reembolso vigentes na data da contratação.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Propriedade Intelectual</h2>
                        <p>Todo o conteúdo, design, gráficos e código da plataforma são propriedade exclusiva da FL360 Miles e estão protegidos por leis de direitos autorais e propriedade intelectual.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Responsabilidades</h2>
                        <p>A FL360 Miles fornece ferramentas para auxiliar na gestão de milhas, mas não se responsabiliza por perdas financeiras decorrentes de decisões de compra ou venda do usuário, nem por alterações nas regras dos programas de fidelidade.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">6. Alterações</h2>
                        <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.</p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-xs text-slate-600">© 2024 FL360 Miles. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
