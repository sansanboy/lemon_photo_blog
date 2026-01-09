import Link from "next/link";

type Tag = {
  id: string;
  name: string;
};

type TagFilterProps = {
  tags: Tag[];
  currentTag?: string | null;
};

export function TagFilter({ tags, currentTag }: TagFilterProps) {
  return (
    <div className="tag-filter">
      <Link
        href="/"
        className={`px-4 py-2 rounded-full border text-sm transition-all ${
          !currentTag
            ? "bg-[#6B5344] border-[#6B5344] text-white"
            : "border-[#B8A888] text-[#4A3828] hover:bg-[#B8A888] hover:text-white"
        }`}
      >
        全部
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/?tag=${encodeURIComponent(tag.name)}`}
          className={`px-4 py-2 rounded-full border text-sm transition-all ${
            currentTag === tag.name
              ? "bg-[#6B5344] border-[#6B5344] text-white"
              : "border-[#B8A888] text-[#4A3828] hover:bg-[#B8A888] hover:text-white"
          }`}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}