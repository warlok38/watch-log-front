type ShowPosterProps = {
  src?: string
  title: string
}

export function ShowPoster({ src, title }: ShowPosterProps) {
  if (src) {
    return <img className="show-poster" src={src} alt={title} loading="lazy" />
  }

  return <div className="show-poster show-poster--fallback">{title.slice(0, 1).toUpperCase()}</div>
}
