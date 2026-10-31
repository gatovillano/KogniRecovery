import { NextRequest } from "next/server";
import { proxy } from "@/lib/proxy";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path.join("/"));
}

export async function POST(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path.join("/"));
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path.join("/"));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path.join("/"));
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(request, path.join("/"));
}
