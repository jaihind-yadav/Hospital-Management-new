const ModalEnhanced = ({ open, title, children, onClose, panelClassName = "", actions = null }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className={`glass-panel-strong section-enter w-full max-w-xl rounded-[28px] p-6 ${panelClassName}`}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1f3f75]">
              Workspace
            </p>
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-medium hover:border-slate-400 hover:bg-slate-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default ModalEnhanced;
