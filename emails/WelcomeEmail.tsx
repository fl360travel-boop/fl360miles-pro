import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
    userName: string;
}

const baseUrl = process.env.URL ? `https://${process.env.URL}` : '';

export const WelcomeEmail = ({
    userName,
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Bem-vindo ao FL360 Miles! Seu Trial de 7 dias começou.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Bem-vindo ao Flight 360 Miles, {userName}!</Heading>

                    <Text style={text}>
                        Sua conta corporativa foi criada com sucesso e o seu <strong>Trial de 7 dias</strong> já está valendo.
                    </Text>

                    <Text style={text}>
                        O Flight 360 Miles é o sistema operacional definitivo para agências de turismo e emissores de passagens com milhas.
                        Durante estes 7 dias, você tem acesso total para cadastrar seus primeiros clientes, gerenciar seus programas de fidelidade, cartões de crédito e visualizar os relatórios dinâmicos.
                    </Text>

                    <Section style={btnContainer}>
                        <Link style={button} href={`https://fl360miles.netlify.app`}>
                            Acessar Meu Painel
                        </Link>
                    </Section>

                    <Text style={text}>
                        Se precisar de qualquer ajuda para configurar os seus primeiros clientes ou entender como funciona a arquitetura do sistema, basta nos responder neste e-mail.
                    </Text>

                    <Text style={footer}>
                        — Equipe Flight 360 Miles
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeEmail;

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
    border: '1px solid #27272A',
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
