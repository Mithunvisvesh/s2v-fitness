// src/app/(dashboard)/members/new/page.tsx
"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memberSchema } from "@/lib/validations/member"
import { createMember } from "@/server/actions/members"
import { useRouter } from "next/navigation"

export default function NewMemberPage() {
  const form = useForm({ resolver: zodResolver(memberSchema) })
  const router = useRouter()

  async function onSubmit(values) {
    const formData = new FormData()
    Object.entries(values).forEach(([k, v]) => formData.append(k, v))
    const res = await createMember(formData)
    if (res.success) router.push(`/members/${res.memberId}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Info Section */}
        <FormField control={form.control} name="fullName" render={...} />
        {/* ... all fields using Shadcn components */}
        <Button type="submit">Create Member</Button>
      </form>
    </Form>
  )
}