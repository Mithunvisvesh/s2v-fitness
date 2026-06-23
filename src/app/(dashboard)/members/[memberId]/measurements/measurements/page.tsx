interface Props {
  params: Promise<{ memberId: string }>
}

export default async function MeasurementsPage({ params }: Props) {
  const { memberId } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Measurements</h1>
      <p>Measurements for member: {memberId}</p>
    </div>
  )
}