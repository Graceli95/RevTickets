from src.models.subcategory import SubCategory
from src.models.category import Category
from src.schemas.subcategory import SubCategoryCreate, SubCategoryUpdate, SubCategoryResponse
from typing import List
class SubCategoryService:
    @staticmethod
    async def create_subcategory(subcategory_data: SubCategoryCreate) -> SubCategoryResponse:
        category = await Category.get(subcategory_data.category_id)
        if not category:
            raise ValueError("Invalid category ID")
            
        subcategory = SubCategory(
            name=subcategory_data.name,
            description=subcategory_data.description,
            category=category
        )
        subcategory = await subcategory.insert()
        subcategory_dict = subcategory.model_dump()
        subcategory_dict["id"] = str(subcategory.id)
        
        # Handle the category field properly - consistent with other methods
        if category:
            subcategory_dict["category"] = {
                "id": str(category.id),
                "name": category.name,
                "description": category.description
            }
        
        return SubCategoryResponse(**subcategory_dict)

    @staticmethod
    async def get_all_subcategories() -> List[SubCategoryResponse]:
        subcategories = await SubCategory.find_all().to_list()
        result = []
        for subcategory in subcategories:
            subcategory_dict = subcategory.model_dump()
            subcategory_dict["id"] = str(subcategory.id)
            
            # Get the category by ID instead of using fetch_link
            if subcategory.category and subcategory.category.ref:
                category = await Category.get(subcategory.category.ref.id)
                if category:
                    subcategory_dict["category"] = {
                        "id": str(category.id),
                        "name": category.name,
                        "description": category.description
                    }
            
            result.append(SubCategoryResponse(**subcategory_dict))
        return result

    @staticmethod
    async def get_subcategory(subcategory_id: str) -> SubCategoryResponse:
        subcategory = await SubCategory.get(subcategory_id)
        if not subcategory:
            return None 
        
        subcategory_dict = subcategory.model_dump()
        subcategory_dict["id"] = str(subcategory.id)
        
        # Get the category by ID instead of using fetch_link
        if subcategory.category and subcategory.category.ref:
            category = await Category.get(subcategory.category.ref.id)
            if category:
                subcategory_dict["category"] = {
                    "id": str(category.id),
                    "name": category.name,
                    "description": category.description
                }
        
        return SubCategoryResponse(**subcategory_dict)

    @staticmethod
    async def update_subcategory(subcategory_id: str, subcategory_data: SubCategoryUpdate) -> SubCategoryResponse:
        subcategory = await SubCategory.get(subcategory_id)
        if not subcategory:
            return None

        subcategory.name = subcategory_data.name or subcategory.name
        subcategory.description = subcategory_data.description or subcategory.description
        if subcategory_data.category_id:
            category = await Category.get(subcategory_data.category_id)
            if not category:
                raise ValueError("Invalid category ID")
            subcategory.category = category

        subcategory = await subcategory.save()
        subcategory_dict = subcategory.model_dump()
        subcategory_dict["id"] = str(subcategory.id)
        
        # Handle the category field properly
        if subcategory.category:
            # Check if it's a Link object (has .ref) or a full Category object
            if hasattr(subcategory.category, 'ref') and subcategory.category.ref:
                # It's a Link object, need to fetch
                category = await Category.get(subcategory.category.ref.id)
                if category:
                    subcategory_dict["category"] = {
                        "id": str(category.id),
                        "name": category.name,
                        "description": category.description
                    }
            else:
                # It's already a full Category object
                subcategory_dict["category"] = {
                    "id": str(subcategory.category.id),
                    "name": subcategory.category.name,
                    "description": subcategory.category.description
                }

        return SubCategoryResponse(**subcategory_dict)

    @staticmethod
    async def delete_subcategory(subcategory_id: str):
        subcategory = await SubCategory.get(subcategory_id)
        if subcategory:
            await subcategory.delete()

