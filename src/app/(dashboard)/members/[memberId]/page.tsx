interface Props {
  params: Promise<{ memberId: string }>
}

export default async function MemberProfilePage({ params }: Props) {
  const { memberId } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Member Profile</h1>
      <p>Member ID: {memberId}</p>
    </div>
  )
}