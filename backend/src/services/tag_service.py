from src.models.tag import Tag
from src.schemas.tag import TagCreate, TagUpdate, TagResponse

class TagService:
    @staticmethod
    async def create_tag(tag_data: TagCreate) -> TagResponse:
        tag = Tag(**tag_data.dict())
        await tag.insert()
        tag_dict = tag.model_dump()
        tag_dict["id"] = str(tag.id)
        return TagResponse(**tag_dict)

    @staticmethod
    async def get_tag(tag_id: str) -> TagResponse:
        tag =  await Tag.get(tag_id)
        if tag:
            tag_dict = tag.model_dump()
            tag_dict["id"] = str(tag.id)
            return TagResponse(**tag_dict)
        return None


    @staticmethod
    async def update_tag(tag_id: str, tag_data: TagUpdate) -> TagResponse:
        tag = await Tag.get(tag_id)
        if tag is None:
            return None
        tag_data_dict = tag_data.dict(exclude_unset=True)
        for k, v in tag_data_dict.items():
            setattr(tag, k, v)
        await tag.save()
        tag_dict = tag.model_dump()
        tag_dict["id"] = str(tag.id)
        return TagResponse(**tag_dict)

    @staticmethod
    async def delete_tag(tag_id: str):
        tag = await Tag.get(tag_id)
        if tag:
            await tag.delete()
