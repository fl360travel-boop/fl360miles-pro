import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentSuccessEmailProps {
    userName: string;
    planName: string;
}

export const PaymentSuccessEmail = ({
    userName = "Cliente",
    planName = "Profissional",
}: PaymentSuccessEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Pagamento Confirmado! Bem-vindo ao Plano {planName}.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Pagamento Confirmado! 🎉</Heading>

                    <Text style={text}>
                        Olá, {userName}. A sua assinatura do <strong>Plano {planName}</strong> foi processada com sucesso!
                    </Text>

                    <Text style={text}>
                        Sua conta corporativa do Flight 360 Miles agora possui acesso irrestrito às ferramentas premium da plataforma.
                        Você já pode gerar seus relatórios PDF, gerenciar volume ilimitado de milhas e usufruir de todas as métricas avançadas.
                    </Text>

                    <Section style={btnContainer}>
                        <Link style={button} href={`https://fl360miles.com.br`}>
                            Acessar Painel Premium
                        </Link>
                    </Section>

                    <Text style={text}>
                        A nota fiscal referente a esta cobrança será enviada em breve pelo próprio Gateway de Pagamentos (Asaas).
                    </Text>

                    <Text style={footer}>
                        — Equipe Flight 360 Miles
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default PaymentSuccessEmail;

const main = {
    backgroundColor: '#0A0A0B',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '560px',
    backgroundColor: '#111113',
    border: '1px solid #10B98133', // Emerald sutil
    borderRadius: '12px',
};

const h1 = {
    color: '#FFFFFF',
    fontSize: '24px',
    fontWeight: 'bold',
    paddingTop: '20px',
    paddingBottom: '20px',
};

const text = {
    color: '#A1A1AA',
    fontSize: '15px',
    lineHeight: '24px',
    marginBottom: '20px',
};

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#10B981',
    borderRadius: '8px',
    color: '#0A0A0B',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const footer = {
    color: '#52525B',
    fontSize: '13px',
    marginTop: '32px',
    paddingTop: '32px',
    borderTop: '1px solid #27272A',
};
