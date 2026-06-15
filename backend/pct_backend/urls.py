from django.urls import path

from providers.views import provider_coords, provider_detail, provider_search, status


urlpatterns = [
    path("status/", status, name="status"),
    path("api/providers/search", provider_search, name="provider-search"),
    path("api/providers/coords", provider_coords, name="provider-coords"),
    path("api/providers/<int:provider_id>", provider_detail, name="provider-detail"),
]
