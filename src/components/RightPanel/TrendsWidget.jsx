const TrendsWidget = () => {
  const trends = [
    { topic: '#Boca', posts: '45.2K posts' },
    { topic: '#River', posts: '38.7K posts' },
    { topic: '#PrimeraDivisión', posts: '25.1K posts' },
  ]

  return (
    <div className="bg-base-200/50 rounded-2xl overflow-hidden border border-base-300">
      <div className="p-3">
        <h2 className="text-lg font-bold mb-2">Tendencias en fútbol</h2>
        <div className="space-y-2">
          {trends.map((trend, index) => (
            <div key={index} className="cursor-pointer hover:bg-base-200/50 p-1.5 -m-1.5 rounded-lg transition-colors group">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs text-base-content/60">Tendencia en Argentina</p>
                  <p className="font-bold text-sm text-primary">{trend.topic}</p>
                  <p className="text-xs text-base-content/60">{trend.posts}</p>
                </div>
              </div>
            </div>
          ))}
          <button className="text-primary hover:underline text-xs pt-1">
            Mostrar más
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrendsWidget