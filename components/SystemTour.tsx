import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';

const SystemTour: React.FC = () => {
    const { userProfile } = useAuth();

    // Check if the user has already seen the full tour
    const [run, setRun] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('has_seen_full_tour');
        if (!hasSeenTour) {
            // Atraso intencional para carregar imagens e animações do painel antes
            const timer = setTimeout(() => {
                setRun(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [userProfile]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('has_seen_full_tour', 'true');
        }
    };

    // TOUR EXAUSTIVO DE TODO O SISTEMA CONFORME SOLICITADO
    const steps: Step[] = [
        {
            target: '.tour-step-dashboard', // O grid dos 4 pilares no Dashboard
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">Comando Central (Início)</h3>
                    <p className="text-slate-300 text-sm">Bem-vindo(a) ao FL360 Miles! Este painel é o coração financeiro da sua operação. Aqui você acompanhará o crescimento do patrimônio diário, milhas e os lucros em tempo real.</p>
                </div>
            ),
            disableBeacon: true,
            placement: 'bottom',
        },
        {
            target: '.tour-step-clients', // Menu Clientes
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">1. Base de Clientes (CRM)</h3>
                    <p className="text-slate-300 text-sm">Neste menu você irá cadastrar os titulares das contas e programas de fidelidade (Latam, Smiles, etc). O sistema fará a varredura completa por trás de cada pessoa adicionada aqui.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-operations', // Menu Operações
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">2. Operações de Milhas</h3>
                    <p className="text-slate-300 text-sm">Sempre que você vender uma passagem ou emitir resgates com as milhas de um cliente, registre aqui. O sistema vai abater o saldo automaticamente e calcular o lucro da venda de ponta a ponta.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-summary', // Menu Resumo (Relatórios)
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">3. Relatórios Estratégicos</h3>
                    <p className="text-slate-300 text-sm">Quer puxar os relatórios no final do mês? Neste menu você acessa o DRE, faturamento total, custo médio por milheiro e exporta a performance da sua agência.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-alerts', // Menu Alertas
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">4. Central de Notificações</h3>
                    <p className="text-slate-300 text-sm">A plataforma rastreia CPFs e validades. Quando os pontos estiverem prestes a expirar ou se a cota do titular estourar, a central te avisará aqui imediatamente.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-concierge', // Menu Concierge VIP
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">5. O Concierge Altitude (IA)</h3>
                    <p className="text-slate-300 text-sm">Chega de perder tempo armando cotações no Whatsapp. Peça para a nossa IA gerar propostas de viagens corporativas em segundos e impressione seus clientes.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-settings', // Menu Configurações
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">6. Configurações Próprias</h3>
                    <p className="text-slate-300 text-sm">Altere seus dados de segurança ou suba uma foto para o seu perfil pessoal (Avatar) que aparece no canto da tela.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-team', // Menu Equipe
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">7. Gestão de Equipe</h3>
                    <p className="text-slate-300 text-sm">No modo Multitenant Premium, adicione funcionários e limite o que eles podem ver na plataforma para trabalhar ao seu lado em segurança.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '.tour-step-plans', // Menu Planos/White Label
            content: (
                <div>
                    <h3 className="text-[#E2BE6A] font-black uppercase tracking-widest text-xs mb-2">8. White Label e Upgrade</h3>
                    <p className="text-slate-300 text-sm">Faça o upload da SUA logomarca nas configurações! Além disso, gerencie o nível da sua assinatura para não estourar o limite de contas cadastradas.</p>
                </div>
            ),
            placement: 'right',
        }
    ];

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#E2BE6A',
                    backgroundColor: '#16191E',
                    textColor: '#F8FAFC',
                    overlayColor: 'rgba(0, 0, 0, 0.85)',
                    arrowColor: '#16191E'
                },
                tooltip: {
                    border: '1px solid rgba(226,190,106, 0.2)',
                    borderRadius: '24px',
                    padding: '24px'
                },
                buttonNext: {
                    backgroundColor: '#E2BE6A',
                    color: '#0A0D11',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    borderRadius: '12px',
                    padding: '12px 20px'
                },
                buttonBack: {
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    fontWeight: 700
                },
                buttonSkip: {
                    color: '#64748B',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    fontWeight: 700
                }
            }}
            locale={{
                back: 'Anterior',
                close: 'Fechar',
                last: 'Começar a Usar!',
                next: 'Avançar',
                skip: 'Pular'
            }}
        />
    );
};

export default SystemTour;
