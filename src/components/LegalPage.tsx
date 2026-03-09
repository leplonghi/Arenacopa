import { ReactNode } from "react";
import { Layout } from "./Layout";

interface LegalPageProps {
    title: string;
    children: ReactNode;
}

export const LegalPage = ({ title, children }: LegalPageProps) => {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 pb-32">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">{title}</h1>
                <div
                    className="mx-auto text-gray-300 space-y-4"
                    style={{
                        fontSize: "15px",
                        lineHeight: 1.8,
                        maxWidth: "720px"
                    }}
                >
                    {children}
                </div>
            </div>
        </Layout>
    );
};
