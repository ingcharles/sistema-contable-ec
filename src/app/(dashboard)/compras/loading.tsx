

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-white rounded-xl border border-slate-100"></div>
            <div className="flex justify-end gap-2">
                <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
                <div className="h-10 w-40 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-white rounded-xl border border-slate-100"></div>
        </div>
    );
}
