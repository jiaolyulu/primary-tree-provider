from django.urls import path

from providers.views import provider_search, status


urlpatterns = [
    path("status/", status, name="status"),
    path("api/providers/search", provider_search, name="provider-search"),
]
