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

interface TrialEndingEmailProps {
    userName: string;
    daysLeft: number;
}

export const TrialEndingEmail = ({
    userName,
    daysLeft,
}: TrialEndingEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Atenção: Seu período de teste termina em {daysLeft} dias.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Seu período de testes está acabando!</Heading>

                    <Text style={text}>
                        Olá, {userName}. Esperamos que você esteja aproveitando o poder do Flight 360 Miles para escalar a sua operação.
                    </Text>

                    <Text style={text}>
                        Este é um lembrete rápido de que o seu período de testes (Trial) vai acabar em <strong>{daysLeft} dia(s)</strong>.
                        Após este período, as telas administrativas de gestão de milhas e clientes serão bloqueadas.
                    </Text>

                    <Text style={text}>
                        Para garantir que sua operação não sofra nenhuma interrupção, escolha um dos nossos planos agora e continue crescendo conosco.
                    </Text>

                    <Section style={btnContainer}>
                        <Link style={button} href={`https://fl360miles.com.br/plans`}>
                            Ver Planos e Preços
                        </Link>
                    </Section>

                    <Text style={footer}>
                        — Equipe Flight 360 Miles
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default TrialEndingEmail;

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
    border: '1px solid #F59E0B33', // Laranja sutil
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
    backgroundColor: '#F59E0B',
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
