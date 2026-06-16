interface Props {
  params: Promise<{ memberId: string }>
}

export default async function EditMemberPage({ params }: Props) {
  const { memberId } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Edit Member</h1>
      <p>Editing member: {memberId}</p>
    </div>
  )
}