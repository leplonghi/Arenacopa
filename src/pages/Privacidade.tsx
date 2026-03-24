import { LegalPage } from "@/components/LegalPage";

export default function Privacidade() {
    return (
        <LegalPage title="Política de Privacidade">
            <p>
                A sua privacidade é importante para nós. É política do Arena CUP respeitar a sua
                privacidade em relação a qualquer informação sua que possamos coletar no site
                Arena CUP, e outros sites que possuímos e operamos.
            </p>

            <p>
                Solicitamos informações pessoais apenas quando realmente precisamos delas para
                lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu
                conhecimento e consentimento. Também informamos por que estamos coletando e
                como será usado.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Uso de Cookies</h2>
            <p>
                Usamos apenas cookies essenciais para autenticação e segurança da sua conta.
                Não utilizamos cookies de rastreamento de terceiros ou para fins publicitários.
            </p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Compartilhamento de Dados</h2>
            <p>
                Não compartilhamos informações de identificação pessoal publicamente ou com
                terceiros, exceto quando exigido por lei.
            </p>

            <p className="mt-8">
                Esta política é efetiva a partir de março de 2026.
            </p>
        </LegalPage>
    );
}
