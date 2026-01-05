import Link from "next/link";

type Tag = {
  id: number | string;
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
        className={`px-4 py-2 rounded-full border text-sm transition-colors ${
          !currentTag 
            ? "bg-blue-600 border-blue-600 text-white" 
            : "border-gray-700 text-gray-300 hover:bg-gray-800"
        }`}
      >
        全部
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/?tag=${encodeURIComponent(tag.name)}`}
          className={`px-4 py-2 rounded-full border text-sm transition-colors ${
            currentTag === tag.name
              ? "bg-blue-600 border-blue-600 text-white" 
              : "border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}