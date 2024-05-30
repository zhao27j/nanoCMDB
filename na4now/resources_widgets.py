from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from django.db.models import QuerySet


class ForeignKeyWidgetWithCreation(ForeignKeyWidget):
    """
    Taken from a GitHub post.
    https://github.com/django-import-export/django-import-export/issues/318#issuecomment-139989178
    """

    def __init__(self, model, field="pk", create=False, **kwargs):
        self.model = model
        self.field = field
        self.create = create
        super(ForeignKeyWidgetWithCreation, self).__init__(
            model, field=field, **kwargs)

    def clean(self, value, **kwargs):
        if not value:
            return None

        if self.create:
            self.model.objects.get_or_create(**{self.field: value})

        val = super(ForeignKeyWidgetWithCreation, self).clean(value, **kwargs)

        return self.model.objects.get(**{self.field: val}) if val else None


class ManyToManyWidgetWithCreation(ManyToManyWidget):
    """ Taken from a GitHub post. https://github.com/django-import-export/django-import-export/issues/318#issuecomment-139989178 """

    def __init__(self, model, field="pk", create=False, **kwargs):
        self.model = model
        self.field = field
        self.create = create
        super(ManyToManyWidgetWithCreation, self).__init__(
            model, field=field, **kwargs)

    def clean(self, value, **kwargs):

        # If no value was passed then we don't have anything to clean.

        if not value:
            return self.model.objects.none()

        # Call the super method. This will return a QuerySet containing any pre-existing objects.
        # Any missing objects will be

        cleaned_value: QuerySet = super(ManyToManyWidgetWithCreation, self).clean(
            value, **kwargs
        )

        # Value will be a string that is separated by `self.separator`.
        # Each entry in the list will be a reference to an object. If the object exists it will
        # appear in the cleaned_value results. If the number of objects in the cleaned_value
        # results matches the number of objects in the delimited list then all objects already
        # exist and we can just return those results.

        object_list = value.split(self.separator)

        if len(cleaned_value.all()) == len(object_list):
            return cleaned_value

        # If we are creating new objects then loop over each object in the list and
        # use get_or_create to, um, get or create the object.

        if self.create:
            for object_value in object_list:
                _instance, _new = self.model.objects.get_or_create(
                    **{self.field: object_value}
                )

        # Use `filter` to re-locate all the objects in the list.

        model_objects = self.model.objects.filter(
            **{f"{self.field}__in": object_list})

        return model_objects


class CustomManyToManyWidget(ManyToManyWidget):

    def __init__(self, model, separator=None, field=None, *args, **kwargs):
        self.lookup_field = kwargs.get('lookup_field', None)
        super(CustomManyToManyWidget, self).__init__(model)
        self.field = field

    def clean(self, value, row=None, *args, **kwargs):
        if not value:
            return self.model.objects.none()
        if isinstance(value, (float, int)):
            ids = [int(value)]
        else:
            ids = value.split(self.separator)
            ids = filter(None, [i.strip() for i in ids])

        return self.model.objects.filter(**{"{}__{}__in".format(self.field, self.lookup_field): ids})
