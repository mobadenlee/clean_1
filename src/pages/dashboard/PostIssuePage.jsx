import PostIssueForm from '../../components/issues/PostIssueForm'

export default function PostIssuePage() {
  return (
    <div className="page-content animate-in" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Post an Issue</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
          Describe your problem clearly to get the best help from the community.
        </p>
      </div>
      <PostIssueForm />
    </div>
  )
}
