import { Link } from 'react-router-dom'

const PostContent = ({ post, onClick }) => {
  return (
    <Link 
      to={`/post/${post.id}`}
      onClick={onClick}
      className="block cursor-pointer px-6 pb-3"
    >
      <div className="mt-3">
        <p className="text-base-content leading-relaxed break-words hyphens-auto whitespace-pre-wrap overflow-hidden">
          {post.content}
        </p>
      </div>
    </Link>
  )
}

export default PostContent