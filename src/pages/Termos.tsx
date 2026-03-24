import { LegalPage } from "@/components/LegalPage";

export default function Termos() {
    return (
        <LegalPage title="Termos de Uso">
            <p>
                Ao acessar ao site Arena CUP, concorda em cumprir estes termos de serviço, todas
                as leis e regulamentos aplicáveis e concorda que é responsável pelo
                cumprimento de todas as leis locais aplicáveis.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Uso do Aplicativo</h2>
            <p>
                O Arena CUP é uma plataforma social para criação e gerenciamento de bolões
                recreativos. O uso de nossa plataforma deve ser estritamente para fins de entretenimento.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Proibição de Apostas Financeiras</h2>
            <p>
                <strong>O Arena CUP não intermedia, incentiva ou gerencia apostas em dinheiro reais.</strong>
                Nossas funcionalidades são puramente para registro de palpites e pontuações
                (ranking social). Qualquer acordo financeiro ou premiações externas
                entre os participantes de um Bolão são de responsabilidade exclusiva
                dos organizadores e envolvidos, isentando o Arena CUP de qualquer
                vínculo legal ou obrigação financeira.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Conta e Segurança</h2>
            <p>
                Você é responsável por manter a confidencialidade de sua conta e senha
                e por restringir o acesso ao seu dispositivo.
            </p>

            <p className="mt-8">
                Estes termos são efetivos a partir de março de 2026.
            </p>
        </LegalPage>
    );
}
