interface FooterProps {
  onOpenHistory: () => void;
}

export function Footer({ onOpenHistory }: FooterProps) {
  return (
    <footer className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="font-display text-lg font-bold text-slate-900">
            QuadBite
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Saintgits College of Engineering &amp; Saintgits College of Applied Sciences · Kottukulam Hills, Pathamuttom P.O., Kottayam, Kerala 686532
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
          <a href="#menu" className="hover:text-slate-900 transition-colors">
            Campus Menu
          </a>
          <a href="#drop-pin" className="hover:text-slate-900 transition-colors">
            Drop-Off Map
          </a>
          <a href="#batch-tracker" className="hover:text-slate-900 transition-colors">
            Batch Tracker
          </a>
          <button
            type="button"
            onClick={onOpenHistory}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Order History
          </button>
          <a href="#student-courier" className="hover:text-slate-900 transition-colors">
            Become a Student Courier
          </a>
        </div>
      </div>
    </footer>
  );
}
