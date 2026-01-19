export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
                ))}
            </div>
        </div>
    );
}
