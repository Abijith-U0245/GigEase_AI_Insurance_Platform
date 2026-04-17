import React, { useEffect, useState } from 'react';
import { Newspaper, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ZoneNewsFeed({ zoneId }: { zoneId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/news/zone/${zoneId}`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [zoneId]);

  if (loading) return <div className="animate-pulse bg-white/5 h-64 rounded-xl border border-white/5 w-full" />;
  if (!data) return null;

  return (
    <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden w-full h-full flex flex-col">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
            <Newspaper size={20} className="text-[#FF5722]" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Zone News Monitor</h3>
            <p className="text-zinc-500 text-xs">Live feed for {zoneId}</p>
          </div>
        </div>

        {data.rsmd_alert && (
          <div className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-red-500 font-bold text-xs">RSMD RISK HIGH</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
        {data.articles?.map((article: any, i: number) => (
          <div key={i} className="group cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-white text-sm font-medium leading-tight group-hover:text-[#FF5722] transition-colors">
                {article.title}
              </h4>
              {article.is_rsmd_signal && (
                <span className="shrink-0 ml-3 bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/20">
                  FLAG
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs line-clamp-2 mt-1">{article.description}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-600 font-medium">
              <span>{article.source}</span>
              <span>•</span>
              <span>{new Date(article.published).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {(!data.articles || data.articles.length === 0) && (
          <div className="text-zinc-500 text-sm text-center py-6">No recent alerts found for {zoneId}.</div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-zinc-400 flex items-center gap-1"><TrendingUp size={12} /> RSMD Score</span>
        <span className={`text-sm font-mono font-bold ${data.rsmd_news_score >= 0.6 ? 'text-red-400' : 'text-green-400'}`}>
          {(data.rsmd_news_score * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
