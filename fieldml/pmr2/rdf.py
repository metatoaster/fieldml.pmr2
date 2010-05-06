import rdflib

from pmr2.rdf.base import RdfXmlObject

namespaces = {
    'dc': 'http://purl.org/dc/elements/1.1/',
    'dcterms': 'http://purl.org/dc/terms/',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'vCard': 'http://www.w3.org/2001/vcard-rdf/3.0#',
    'pmr2': 'http://namespace.physiomeproject.org/pmr2#',
    'pmr2note': 'http://namespace.physiomeproject.org/pmr2/note#',
}


class RdfExposureNoteHelper(RdfXmlObject):

    def queryNote(self, name):
        subject = namespaces['pmr2note'] + name
        bindings = {
            rdflib.Variable('?subject'): rdflib.URIRef(subject),
        }
        q = """\
        SELECT ?key ?value WHERE {
            ?node pmr2:type ?subject .
            ?node pmr2:fields [ ?li ?fnode ] .
            ?fnode pmr2:field [ pmr2:key ?key ] .
            ?fnode pmr2:field [ pmr2:value ?value ] .
        }
        """
        results = self.query(q, bindings, namespaces)
        return [(i[0].strip(), i[1].strip()) for i in results]

