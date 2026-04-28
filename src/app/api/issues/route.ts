import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/issues
 * 取得所有啟用的服務問題分類
 * 支援 ?category=xxx 過濾
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const issues = await prisma.serviceIssue.findMany({
    where: {
      isActive: true,
      ...(category ? { parentCategory: category } : {}),
    },
    select: {
      id: true,
      label: true,
      parentCategory: true,
      requiresLicense: true,
      licenseNote: true,
      jobType: true,
      sortOrder: true,
    },
    orderBy: [{ parentCategory: "asc" }, { sortOrder: "asc" }],
  });

  // 按類別分組
  const grouped = issues.reduce((acc: Record<string, typeof issues>, issue) => {
    const cat = issue.parentCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(issue);
    return acc;
  }, {});

  return NextResponse.json({ issues, grouped });
}
