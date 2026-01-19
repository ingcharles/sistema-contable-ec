

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-24 bg-white rounded-xl border border-slate-100"></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-white rounded-xl border border-slate-100"></div>
                <div className="h-24 bg-white rounded-xl border border-slate-100"></div>
            </div>
            <div className="h-96 bg-white rounded-xl border border-slate-100"></div>
        </div>
    );
}
