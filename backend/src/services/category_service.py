from src.models.category import Category
from src.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from typing import List, Optional
from src.schemas.subcategory import SubCategoryResponse
from src.models.subcategory import SubCategory

class CategoryService:
    @staticmethod
    async def create_category(category_data: CategoryCreate) -> CategoryResponse:
        category = Category(
            name=category_data.name,
            description=category_data.description
        )
        await category.insert()
        category_dict = category.model_dump()
        category_dict["id"] = str(category.id)
        return CategoryResponse(**category_dict)

    @staticmethod
    async def get_category(category_id: str) -> Optional[CategoryResponse]:
        category = await Category.get(category_id)
        if category:
            category_dict = category.model_dump()
            category_dict["id"] = str(category.id)
            return CategoryResponse(**category_dict)
        return None

    @staticmethod
    async def update_category(category_id: str, category_data: CategoryUpdate) -> Optional[CategoryResponse]:
        category = await Category.get(category_id)
        if category is None:
            return None
        data = category_data.dict(exclude_unset=True)

        for k, v in data.items():
            setattr(category, k, v)

        category = await category.save()
        category_dict = category.model_dump()
        category_dict["id"] = str(category.id)
        return CategoryResponse(**category_dict)

    @staticmethod
    async def delete_category(category_id: str):
        category = await Category.get(category_id)
        if category:
            await category.delete()
    
    @staticmethod
    async def get_all_categories() -> List[CategoryResponse]:
        categories = await Category.find_all().to_list()
        response = []
        for cat in categories:
            cat_dict = cat.model_dump()
            cat_dict["id"] = str(cat.id)
            response.append(CategoryResponse(**cat_dict))
        return response
    @staticmethod
    async def get_subcategories_by_category(category_id: str) -> List[SubCategoryResponse]:
        subcategories = await SubCategory.find(SubCategory.category.id == category_id).to_list()
        response = []
        for sub in subcategories:
            sub_dict = sub.model_dump()
            sub_dict["id"] = str(sub.id)
            sub_dict["category"] = {
                "id": str(sub.category.id),
                "name": sub.category.name,
                "description": sub.category.description,
                "tags": sub.category.tags
            }
            response.append(SubCategoryResponse(**sub_dict))
        return response