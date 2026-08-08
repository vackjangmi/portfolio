import { ensureLinksStorage, getLinksDb } from "../../../../db/links";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  await ensureLinksStorage();
  const { slug } = await context.params;
  const result = await getLinksDb()
    .prepare("DELETE FROM links WHERE slug = ?")
    .bind(slug)
    .run();

  if (!result.meta.changes) {
    return Response.json({ error: "주소를 찾을 수 없습니다." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
