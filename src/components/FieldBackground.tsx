/**
 * FieldBackground — Campo de futebol global, idêntico ao original do Auth.tsx.
 * Renderizado fixo atrás de todo conteúdo (z-index: -10).
 */
const FieldBackground = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden"
  >
    {/* Base Layer */}
    <div className="absolute inset-0 bg-[#061A10]" />

    {/* Real Field Image */}
    <div
      className="absolute inset-0 opacity-60 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
      style={{
        backgroundImage: "url('/images/campo-bg.png')",
        backgroundBlendMode: "overlay",
      }}
    />

    {/* Malha/Textura de fundo */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />

    {/* Overlay principal do campo */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

    {/* Global Accent Glows */}
    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-copa-success/10 blur-[100px]" />
    <div 
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{ backgroundImage: "url('/noise.svg')" }}
    />
  </div>
);


export default FieldBackground;
