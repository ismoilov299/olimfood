"""Category parent/child tree helpers, shared by the categories and products routers."""
from sqlalchemy.orm import Session
import models


def descendant_ids(db: Session, cat_id: int) -> set:
    """Return {cat_id} plus every descendant category id (any depth)."""
    ids = {cat_id}
    frontier = [cat_id]
    while frontier:
        rows = db.query(models.Category.id).filter(models.Category.parent_id.in_(frontier)).all()
        frontier = [r.id for r in rows if r.id not in ids]
        ids.update(frontier)
    return ids


def creates_cycle(db: Session, cat_id: int, new_parent_id: int) -> bool:
    """True if setting new_parent_id as cat_id's parent would create a cycle
    (i.e. new_parent_id is cat_id itself or one of its own descendants)."""
    return new_parent_id in descendant_ids(db, cat_id)
